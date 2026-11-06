<?php
/**
 * Interest / contact form. Args: array( 'imovel' => post id, 'title' => heading ).
 */
$imovel = isset( $args['imovel'] ) ? (int) $args['imovel'] : 0;
$flag   = isset( $_GET['contato'] ) ? sanitize_key( $_GET['contato'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$msg    = cn_lead_message( $flag );
?>
<section class="section section-navy" id="contato">
	<div class="wrap contact-grid">
		<div>
			<p class="eyebrow">Contato</p>
			<h2><?php echo $imovel ? 'Quero conhecer este imóvel' : 'Conte o que você procura'; ?></h2>
			<p class="lead">Um corretor responde no mesmo dia útil, com opções que cabem no seu orçamento e uma visita marcada quando fizer sentido.</p>
			<ul class="contact-list">
				<li><span>Telefone</span><strong><?php echo esc_html( cn_opt( 'phone' ) ); ?></strong></li>
				<li><span>Escritório</span><strong><?php echo esc_html( cn_opt( 'address' ) ); ?></strong></li>
				<li><span>Horário</span><strong><?php echo esc_html( cn_opt( 'hours' ) ); ?></strong></li>
			</ul>
		</div>
		<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" novalidate>
			<?php if ( 'ok' === $flag ) : ?><p class="notice ok" role="status">Mensagem recebida! Um corretor entra em contato em breve.</p><?php endif; ?>
			<?php if ( $msg ) : ?><p class="notice err" role="alert"><?php echo esc_html( $msg ); ?></p><?php endif; ?>
			<input type="hidden" name="action" value="cn_lead">
			<input type="hidden" name="imovel" value="<?php echo (int) $imovel; ?>">
			<?php wp_nonce_field( 'cn_lead' ); ?>
			<div class="hp" aria-hidden="true"><label>Site <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
			<label>Seu nome <input type="text" name="nome" required autocomplete="name"></label>
			<div class="two">
				<label>E-mail <input type="email" name="email" required autocomplete="email"></label>
				<label>Telefone <input type="tel" name="telefone" autocomplete="tel" inputmode="tel" placeholder="(41) 90000-0000"></label>
			</div>
			<label>Mensagem <textarea name="mensagem" rows="4" maxlength="600" placeholder="Bairro, número de quartos, prazo de mudança…"></textarea></label>
			<button class="btn" type="submit">Enviar</button>
		</form>
	</div>
</section>
