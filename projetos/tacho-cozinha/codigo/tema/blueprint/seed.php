<?php
// Demo content for the Tacho Cozinha theme: sections, dishes, menu. Fictional restaurant.
require_once '/wordpress/wp-load.php';

$menu = array(
	'Entradas' => array(
		array( 'Pão de queijo da casa', 'Assado a cada hora, com queijo curado de Minas.', 18, 'Vegetariano', 1, 'Receita da dona Lourdes: polvilho azedo, queijo canastra curado e forno de lenha. Sai quente, em porção de seis.' ),
		array( 'Torresmo de rolo', 'Barriga enrolada, seca ao sol e frita na hora.', 32, '', 0, 'Crocante por fora e macio por dentro, com limão e geleia de pimenta da casa.' ),
		array( 'Caldo de mandioca com carne seca', 'Cremoso, com carne seca desfiada e cebolinha.', 26, '', 0, 'Servido em cumbuca de barro, com torradas de pão de fermentação natural.' ),
	),
	'Pratos' => array(
		array( 'Feijão tropeiro', 'Com linguiça, ovo, couve e farofa crocante.', 58, '', 1, 'O prato mais pedido. Feijão cozido de véspera, linguiça artesanal e couve na hora. Serve duas pessoas com folga.' ),
		array( 'Frango com quiabo', 'Frango caipira refogado com quiabo e angu.', 54, 'Sem glúten', 1, 'Caipira de sítio parceiro, quiabo sem baba e angu cremoso de fubá moído em pedra.' ),
		array( 'Costelinha com goiabada', 'Assada por 8 horas, laqueada com goiabada.', 74, '', 1, 'Costelinha suína que desmancha, com purê de mandioquinha e agrião.' ),
		array( 'Moqueca de banana-da-terra', 'Leite de coco, dendê e palmito pupunha.', 52, 'Vegano', 0, 'Versão vegetal da casa: banana-da-terra, pupunha, pimentão e coentro, com arroz de alho.' ),
		array( 'Vaca atolada', 'Costela bovina com mandioca cozida lentamente.', 68, 'Sem glúten', 0, 'Cozida por 5 horas até a mandioca virar creme. Acompanha arroz branco e couve.' ),
		array( 'Truta ao limão-siciliano', 'Truta do Sul de Minas, manteiga e ervas.', 79, '', 0, 'Filé grelhado na hora, com batata-bolinha assada e legumes da feira.' ),
	),
	'Sobremesas' => array(
		array( 'Doce de leite em tacho', 'Mexido à mão por três horas, com queijo fresco.', 24, 'Vegetariano', 1, 'O doce que dá nome à casa. Servido morno, com queijo minas frescal.' ),
		array( 'Romeu e Julieta', 'Queijo minas com goiabada cascão.', 22, 'Vegetariano', 0, 'Clássico mineiro, sem enfeite: goiabada cascão e queijo meia-cura.' ),
		array( 'Pudim de cachaça', 'Calda de caramelo e um toque de cachaça envelhecida.', 26, 'Vegetariano', 0, 'Textura cremosa e sem furinhos, com calda escura e flor de sal.' ),
	),
	'Bebidas' => array(
		array( 'Limonada de hortelã', 'Limão tahiti, hortelã fresca e rapadura.', 14, 'Vegano', 0, 'Preparada na jarra, sem açúcar refinado.' ),
		array( 'Café coado na hora', 'Grãos do Sul de Minas, torra média.', 9, 'Vegano', 0, 'Coado no pano, de uma fazenda parceira em Carmo de Minas.' ),
		array( 'Caipirinha de cachaça artesanal', 'Cachaça de alambique de Salinas.', 28, '', 0, 'Limão, açúcar demerara e cachaça envelhecida em bálsamo.' ),
	),
);

wp_delete_post( 1, true );
wp_delete_post( 2, true );
$order = 0;
foreach ( $menu as $section => $dishes ) {
	$term = wp_insert_term( $section, 'secao' );
	$tid  = is_wp_error( $term ) ? $term->get_error_data() : $term['term_id'];
	foreach ( $dishes as $d ) {
		$pid = wp_insert_post( array(
			'post_type'    => 'prato',
			'post_status'  => 'publish',
			'post_title'   => $d[0],
			'post_excerpt' => $d[1],
			'post_content' => '<p>' . $d[5] . '</p>',
			'menu_order'   => $order++,
			'meta_input'   => array( 'tacho_preco' => $d[2], 'tacho_tag' => $d[3], 'tacho_destaque' => $d[4] ? '1' : '' ),
		) );
		wp_set_object_terms( $pid, array( (int) $tid ), 'secao' );
	}
}

$menu_id = wp_create_nav_menu( 'Principal' );
foreach ( array( 'Cardápio' => '/cardapio/', 'Destaques' => '/#destaques', 'A casa' => '/#historia', 'Reservas' => '/#reservas' ) as $label => $path ) {
	wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $label, 'menu-item-url' => home_url( $path ), 'menu-item-status' => 'publish', 'menu-item-type' => 'custom' ) );
}
set_theme_mod( 'nav_menu_locations', array( 'primary' => $menu_id, 'footer' => $menu_id ) );
update_option( 'blogname', 'Tacho Cozinha Mineira' );
update_option( 'blogdescription', 'Comida de fogão a lenha em Curitiba: feijão tropeiro, pão de queijo e doce de tacho' );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();
update_option( 'sidebars_widgets', array( 'footer-notice' => array() ) );
