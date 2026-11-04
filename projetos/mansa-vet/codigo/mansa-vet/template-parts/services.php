<?php
$q = new WP_Query( array( 'post_type' => 'servico', 'posts_per_page' => 6, 'orderby' => 'menu_order title', 'order' => 'ASC' ) );
?>
<section class="section" id="servicos">
	<div class="wrap">
		<header class="section-head">
			<p class="eyebrow">Serviços</p>
			<h2>Tudo o que seu pet precisa, num lugar só.</h2>
		</header>
		<div class="card-grid">
			<?php
			while ( $q->have_posts() ) :
				$q->the_post();
				get_template_part( 'template-parts/card-service' );
			endwhile;
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
